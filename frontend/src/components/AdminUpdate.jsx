import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate, useParams } from 'react-router';
import axiosClient from '../utils/axiosClient';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

const LANGUAGE_ORDER = ['C++', 'Java', 'JavaScript'];

const defaultFormValues = {
  title: '',
  description: '',
  difficulty: 'easy',
  tags: 'array',
  visibleTestCases: [{ input: '', output: '', explanation: '' }],
  hiddenTestCases: [{ input: '', output: '' }],
  startCode: [
    { language: 'C++', initialCode: '' },
    { language: 'Java', initialCode: '' },
    { language: 'JavaScript', initialCode: '' }
  ],
  referenceSolution: [
    { language: 'C++', completeCode: '' },
    { language: 'Java', completeCode: '' },
    { language: 'JavaScript', completeCode: '' }
  ]
};

const normalizeLanguage = (language) => {
  const value = language?.toLowerCase();
  if (value === 'c++' || value === 'cpp') return 'C++';
  if (value === 'java') return 'Java';
  if (value === 'javascript') return 'JavaScript';
  return language;
};

const normalizeStartCode = (startCode = []) =>
  LANGUAGE_ORDER.map((language) => {
    const match = startCode.find((entry) => normalizeLanguage(entry.language) === language);
    return {
      language,
      initialCode: match?.initialCode || ''
    };
  });

const normalizeReferenceSolution = (referenceSolution = []) =>
  LANGUAGE_ORDER.map((language) => {
    const match = referenceSolution.find((entry) => normalizeLanguage(entry.language) === language);
    return {
      language,
      completeCode: match?.completeCode || ''
    };
  });

const mapProblemToFormValues = (problem) => ({
  title: problem.title || '',
  description: problem.description || '',
  difficulty: problem.difficulty || 'easy',
  tags: problem.tags || 'array',
  visibleTestCases: problem.visibleTestCases?.length
    ? problem.visibleTestCases
    : [{ input: '', output: '', explanation: '' }],
  hiddenTestCases: problem.hiddenTestCases?.length
    ? problem.hiddenTestCases
    : [{ input: '', output: '' }],
  startCode: normalizeStartCode(problem.startCode),
  referenceSolution: normalizeReferenceSolution(problem.referenceSolution)
});

function UpdateProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch problems');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg my-4">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Update Problems</h1>
          <p className="text-base-content/70 mt-1">Select a problem to edit its details</p>
        </div>
        <NavLink to="/admin" className="btn btn-ghost">
          Back to Admin
        </NavLink>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr key={problem._id}>
                <th>{index + 1}</th>
                <td>{problem.title}</td>
                <td>
                  <span className={`badge ${
                    problem.difficulty === 'easy'
                      ? 'badge-success'
                      : problem.difficulty === 'medium'
                        ? 'badge-warning'
                        : 'badge-error'
                  }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td>
                  <span className="badge badge-outline">{problem.tags}</span>
                </td>
                <td>
                  <NavLink
                    to={`/admin/update/${problem._id}`}
                    className="btn btn-sm btn-warning"
                  >
                    Edit
                  </NavLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UpdateProblemForm({ problemId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: defaultFormValues
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get(`/problem/adminProblemById/${problemId}`);
        reset(mapProblemToFormValues(data));
        setFetchError(null);
      } catch (err) {
        console.error(err);
        setFetchError('Failed to load problem details');
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, reset]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      await axiosClient.put(`/problem/update/${problemId}`, data);
      alert('Problem updated successfully!');
      navigate('/admin/update');
    } catch (error) {
      const message = error.response?.data || error.message || 'Failed to update problem';
      alert(`Error: ${typeof message === 'string' ? message : 'Failed to update problem'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto p-4">
        <div className="alert alert-error shadow-lg my-4">
          <span>{fetchError}</span>
        </div>
        <NavLink to="/admin/update" className="btn btn-ghost mt-4">
          Back to Problem List
        </NavLink>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Update Problem</h1>
          <p className="text-base-content/70 mt-1">Edit problem details and save changes</p>
        </div>
        <NavLink to="/admin/update" className="btn btn-ghost">
          Back to List
        </NavLink>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                {...register('title')}
                className={`input input-bordered ${errors.title && 'input-error'}`}
              />
              {errors.title && (
                <span className="text-error">{errors.title.message}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                {...register('description')}
                className={`textarea textarea-bordered h-32 ${errors.description && 'textarea-error'}`}
              />
              {errors.description && (
                <span className="text-error">{errors.description.message}</span>
              )}
            </div>

            <div className="flex gap-4">
              <div className="form-control w-1/2">
                <label className="label">
                  <span className="label-text">Difficulty</span>
                </label>
                <select
                  {...register('difficulty')}
                  className={`select select-bordered ${errors.difficulty && 'select-error'}`}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-control w-1/2">
                <label className="label">
                  <span className="label-text">Tag</span>
                </label>
                <select
                  {...register('tags')}
                  className={`select select-bordered ${errors.tags && 'select-error'}`}
                >
                  <option value="array">Array</option>
                  <option value="linkedList">Linked List</option>
                  <option value="graph">Graph</option>
                  <option value="dp">DP</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Cases</h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Visible Test Cases</h3>
              <button
                type="button"
                onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                className="btn btn-sm btn-primary"
              >
                Add Visible Case
              </button>
            </div>

            {visibleFields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeVisible(index)}
                    className="btn btn-xs btn-error"
                    disabled={visibleFields.length === 1}
                  >
                    Remove
                  </button>
                </div>

                <input
                  {...register(`visibleTestCases.${index}.input`)}
                  placeholder="Input"
                  className="input input-bordered w-full"
                />

                <input
                  {...register(`visibleTestCases.${index}.output`)}
                  placeholder="Output"
                  className="input input-bordered w-full"
                />

                <textarea
                  {...register(`visibleTestCases.${index}.explanation`)}
                  placeholder="Explanation"
                  className="textarea textarea-bordered w-full"
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Hidden Test Cases</h3>
              <button
                type="button"
                onClick={() => appendHidden({ input: '', output: '' })}
                className="btn btn-sm btn-primary"
              >
                Add Hidden Case
              </button>
            </div>

            {hiddenFields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeHidden(index)}
                    className="btn btn-xs btn-error"
                    disabled={hiddenFields.length === 1}
                  >
                    Remove
                  </button>
                </div>

                <input
                  {...register(`hiddenTestCases.${index}.input`)}
                  placeholder="Input"
                  className="input input-bordered w-full"
                />

                <input
                  {...register(`hiddenTestCases.${index}.output`)}
                  placeholder="Output"
                  className="input input-bordered w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Code Templates</h2>

          <div className="space-y-6">
            {LANGUAGE_ORDER.map((language, index) => (
              <div key={language} className="space-y-2">
                <h3 className="font-medium">{language}</h3>

                <input type="hidden" {...register(`startCode.${index}.language`)} />
                <input type="hidden" {...register(`referenceSolution.${index}.language`)} />

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Initial Code</span>
                  </label>
                  <pre className="bg-base-300 p-4 rounded-lg">
                    <textarea
                      {...register(`startCode.${index}.initialCode`)}
                      className="w-full bg-transparent font-mono"
                      rows={6}
                    />
                  </pre>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Reference Solution</span>
                  </label>
                  <pre className="bg-base-300 p-4 rounded-lg">
                    <textarea
                      {...register(`referenceSolution.${index}.completeCode`)}
                      className="w-full bg-transparent font-mono"
                      rows={6}
                    />
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-warning w-full" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Problem'}
        </button>
      </form>
    </div>
  );
}

function AdminUpdate() {
  const { problemId } = useParams();

  if (problemId) {
    return <UpdateProblemForm problemId={problemId} />;
  }

  return <UpdateProblemList />;
}

export default AdminUpdate;
